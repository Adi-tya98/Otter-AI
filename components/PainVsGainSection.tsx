"use client";

import React from "react";
import {
  XCircle,
  CheckCircle,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  Split,
  Binary,
  Clock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

export function PainVsGainSection() {
  return (
    <section id="simplicity" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>The Simplicity Manifesto</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Why less integrations and a simpler editor is{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-cyan-400">
              actually a superpower
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            More features doesn't mean better results. Bloated automation tools
            create maintenance nightmares. We built Otter AI around one
            conviction:{" "}
            <strong className="text-white">
              you shouldn't need an engineering degree just to connect 3 apps.
            </strong>
          </p>
        </div>

        {/* Side by side comparison: The Bloat vs The Zen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Old Bloated Way (n8n / Zapier) */}
          <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-900/40 relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  The Complex Automation Trap
                </h3>
                <p className="text-xs text-rose-300/80 font-mono">
                  n8n, Zapier, Make
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Split className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Infinite Canvas Spaghetti
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Nodes spread out over 4,000 pixels. Lines criss-cross in all
                    directions. One wrong drag and your entire layout breaks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Binary className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Cryptic Raw JSON Expressions
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Forced to write{" "}
                    <code className="bg-slate-800 px-1 py-0.5 rounded text-rose-300">
                      &#123;&#123;$json["body"]["items"][0]["id"]&#125;&#125;
                    </code>{" "}
                    just to pull an order ID.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    800+ Half-Baked Integrations
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Dozens of niche, community-abandoned nodes that break
                    silently whenever an API changes a single header.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    1.5GB RAM Heavyweight
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Heavy NodeJS engines and Redis queues require expensive
                    cloud instances just to idle.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* The Otter AI Way */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-cyan-500/30 relative shadow-2xl shadow-cyan-500/5">
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
              The Otter Way
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Calm & Focused Automation
                </h3>
                <p className="text-xs text-cyan-400 font-mono">Otter AI Core</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Linear Flow Cards
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Reads like a clear recipe: Step 1 ➔ Step 2 ➔ Step 3. Clean,
                    scannable, and impossible to get lost in.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Plain-English AI Mapping
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Just click{" "}
                    <span className="text-cyan-300 font-mono">
                      @customer_email
                    </span>{" "}
                    or tell Otter: "extract the billing name and summarize the
                    issue." No regex.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="w-6 h-6 rounded-md bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    The Curated 15 Essential Apps
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    We maintain only the 15 essential platforms (Slack, OpenAI,
                    Stripe, Notion, Postgres, etc.). Every single integration is
                    tested continuously.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    38MB Single Binary / Container
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Starts in 250 milliseconds. Runs on a $4/mo server or local
                    laptop with zero fans spinning up.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight quote banner */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 border border-slate-800 text-center max-w-3xl mx-auto">
          <p className="text-sm sm:text-base text-slate-200 italic">
            "We migrated 18 complex n8n workflows into Otter in an afternoon.
            Our error rate dropped from 12 failures/day to zero, and anyone on
            our marketing team can now edit steps without calling an engineer."
          </p>
          <div className="mt-3 text-xs font-semibold text-amber-400">
            — Marcus Vance, Head of Ops at RelayTech
          </div>
        </div>
      </div>
    </section>
  );
}
