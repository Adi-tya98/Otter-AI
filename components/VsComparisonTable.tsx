"use client";

import React from "react";
import { Check, X, Sparkles, HelpCircle } from "lucide-react";

interface ComparisonRow {
  feature: string;
  category: string;
  otter: { text: string; good: boolean };
  n8n: { text: string; good: boolean };
  zapier: { text: string; good: boolean };
  make: { text: string; good: boolean };
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    feature: "Editor Learning Curve",
    category: "Editor Experience",
    otter: { text: "Zero — Linear cards read like a recipe", good: true },
    n8n: { text: "Steep — 2D canvas with tangled wires", good: false },
    zapier: { text: "Moderate — Deep nested dropdown menus", good: false },
    make: { text: "High — Multi-axis bubble graphs", good: false },
  },
  {
    feature: "Data Mapping Method",
    category: "Editor Experience",
    otter: { text: "Plain-English @tags or AI prompt", good: true },
    n8n: { text: "Raw JS {{ $json.body[0].id }} formulas", good: false },
    zapier: { text: "Dropdown variable picker", good: true },
    make: { text: "Complex nested formula syntax", good: false },
  },
  {
    feature: "Integration Strategy",
    category: "Ecosystem",
    otter: { text: "The Curated 15 (Tested daily, 0% rot)", good: true },
    n8n: { text: "800+ (Many community abandoned)", good: false },
    zapier: { text: "5,000+ (Often shallow triggers)", good: true },
    make: { text: "1,500+ (Variable quality)", good: false },
  },
  {
    feature: "Self-Hosting Resource Footprint",
    category: "Infrastructure",
    otter: { text: "Single 38MB container, SQLite ready", good: true },
    n8n: { text: "1.5GB+ RAM, needs Redis & Postgres", good: false },
    zapier: { text: "Closed source only", good: false },
    make: { text: "Closed source only", good: false },
  },
  {
    feature: "Native AI Transformation",
    category: "AI Capabilities",
    otter: { text: "Built-in Claude/GPT prompt block", good: true },
    n8n: { text: "LangChain node suite (High setup)", good: false },
    zapier: { text: "Basic AI actions (Limited tokens)", good: false },
    make: { text: "Generic HTTP module", good: false },
  },
  {
    feature: "Self-Healing Schema Drift",
    category: "Reliability",
    otter: { text: "AI auto-adjusts field changes", good: true },
    n8n: { text: "None — Pipeline throws unhandled error", good: false },
    zapier: { text: "None — Halts with silent error", good: false },
    make: { text: "None — Requires manual re-map", good: false },
  },
  {
    feature: "Time to First Working Workflow",
    category: "Velocity",
    otter: { text: "3 minutes", good: true },
    n8n: { text: "30 - 60 minutes", good: false },
    zapier: { text: "15 minutes", good: true },
    make: { text: "25 minutes", good: false },
  },
  {
    feature: "Pricing Transparency",
    category: "Pricing",
    otter: { text: "Flat $19/mo (Runaway protection)", good: true },
    n8n: { text: "Tiered execution & active workflow caps", good: false },
    zapier: { text: "Punitive step pricing ($299+/mo)", good: false },
    make: { text: "Operations quotas trigger overages", good: false },
  },
];

export function VsComparisonTable() {
  return (
    <section id="compare" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Honest Benchmark</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Otter AI vs. The Alternatives
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Compare how Otter AI simplifies your stack compared to traditional heavyweights.
          </p>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80">
                <th className="p-4 sm:p-5 font-bold text-slate-400 w-1/4">Capability</th>
                {/* Otter Highlight Column */}
                <th className="p-4 sm:p-5 font-bold text-white bg-gradient-to-b from-cyan-500/10 to-amber-500/5 border-x border-cyan-500/30 w-1/4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">Otter AI</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-bold uppercase">
                      Simpler
                    </span>
                  </div>
                </th>
                <th className="p-4 sm:p-5 font-bold text-slate-300 w-1/6">n8n</th>
                <th className="p-4 sm:p-5 font-bold text-slate-300 w-1/6">Zapier</th>
                <th className="p-4 sm:p-5 font-bold text-slate-300 w-1/6">Make</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {COMPARISON_DATA.map((row, idx) => (
                <tr
                  key={row.feature}
                  className={`hover:bg-slate-850/40 transition-colors ${
                    idx % 2 === 0 ? "bg-slate-900/30" : "bg-transparent"
                  }`}
                >
                  <td className="p-4 sm:p-5 font-medium text-slate-300">
                    <div>{row.feature}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {row.category}
                    </div>
                  </td>

                  {/* Otter Value */}
                  <td className="p-4 sm:p-5 font-semibold text-white bg-gradient-to-b from-cyan-500/5 to-amber-500/5 border-x border-cyan-500/20">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="text-slate-100">{row.otter.text}</span>
                    </div>
                  </td>

                  {/* n8n */}
                  <td className="p-4 sm:p-5 text-slate-400">
                    <div className="flex items-start gap-2">
                      {row.n8n.good ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <span>{row.n8n.text}</span>
                    </div>
                  </td>

                  {/* Zapier */}
                  <td className="p-4 sm:p-5 text-slate-400">
                    <div className="flex items-start gap-2">
                      {row.zapier.good ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <span>{row.zapier.text}</span>
                    </div>
                  </td>

                  {/* Make */}
                  <td className="p-4 sm:p-5 text-slate-400">
                    <div className="flex items-start gap-2">
                      {row.make.good ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <span>{row.make.text}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
