"use client";

import React from "react";
import {
  Layers,
  Sparkles,
  Bot,
  Zap,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Code2,
  Terminal,
  ShieldCheck
} from "lucide-react";

export function SimplicityDeepDive() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built From The Ground Up For Clarity</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Designed for humans,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400">
              powered by native AI
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Every pixel in Otter AI was engineered to eliminate friction. Here is why building
            automations feels radically simpler.
          </p>
        </div>

        {/* 3 Main Feature Breakdowns */}
        <div className="space-y-16">
          {/* Feature 1: Linear Flow vs 2D Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-semibold">
                Feature 01
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Fixed 3-Component Architecture. <br />
                <span className="text-slate-400 font-semibold">
                  No more getting lost in 4,000-pixel whiteboard mazes.
                </span>
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                You do <strong>not</strong> construct workflows. Every agent has exactly three fixed components:
                <span className="text-cyan-300 font-mono"> Trigger → AI Agent → Output</span>. The flow is completely fixed,
                which means zero deadlocks, zero circular loops, and zero graph sprawl. You only configure the three components.
              </p>
              <ul className="space-y-2 pt-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Fixed 3-stage pipeline: Trigger activates, AI reasons, Output delivers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Completely fixed flow eliminates the burden of building and debugging custom DAG workflows</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Always fits cleanly on any screen with instant parameter configuration</span>
                </li>
              </ul>
            </div>

            {/* Feature 1 Visual Card */}
            <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl relative">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                  <span>Linear Flow #41</span>
                  <span className="text-emerald-400">● 3 Steps Active</span>
                </div>

                <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                      1
                    </span>
                    <span className="text-slate-200">Trigger: Chat / Webhook / Telegram Bot</span>
                  </div>
                  <span className="text-indigo-400 text-[10px]">Inbound</span>
                </div>

                <div className="flex justify-center -my-1">
                  <div className="w-0.5 h-4 bg-cyan-500/60" />
                </div>

                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                      2
                    </span>
                    <span className="text-slate-200">Agent Core: Claude 3.7 + HTTP Tool & Memory</span>
                  </div>
                  <span className="text-amber-400 text-[10px]">Model & Tools</span>
                </div>

                <div className="flex justify-center -my-1">
                  <div className="w-0.5 h-4 bg-cyan-500/60" />
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                      3
                    </span>
                    <span className="text-slate-200">Tied Output: Direct Response to Trigger Origin</span>
                  </div>
                  <span className="text-emerald-400 text-[10px]">Tied Output</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Plain-English Data Mapping */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Card (Left) */}
            <div className="lg:col-span-6 order-2 lg:order-1 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl">
              <div className="space-y-4">
                {/* Traditional n8n syntax */}
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs">
                  <div className="text-[10px] text-rose-400 font-bold uppercase mb-1">
                    n8n / Zapier Raw Expression:
                  </div>
                  <code className="text-rose-200 text-[11px] font-mono break-all">
                    &#123;&#123;$item("0").$node["Stripe_Hook"].json["body"]["data"]["object"]["customer_details"]["email"]&#125;&#125;
                  </code>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                  <span>Replaced by Otter AI with:</span>
                </div>

                {/* Otter AI plain english */}
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs shadow-inner">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1">
                    Otter AI Mention Tag:
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
                      @customer_email
                    </span>
                    <span className="text-slate-400 text-xs">or simply type "@email"</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-semibold">
                Feature 02
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Plain-English Mapping. <br />
                <span className="text-slate-400 font-semibold">
                  Never decipher nested JSON brackets again.
                </span>
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Why should you memorize JSON object hierarchies just to send a confirmation email?
                Otter AI flattens incoming payloads and presents every data field as an intuitive
                chip. Click or type <span className="text-cyan-400 font-mono">@</span> to instantly
                insert any variable.
              </p>
              <ul className="space-y-2 pt-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Instant autocomplete menu when typing @ anywhere</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Built-in formatters: @date(friendly), @amount(USD), @name(first)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>No JavaScript knowledge required</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3: Self-Healing Payloads */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold">
                Feature 03
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Self-Healing AI Engine. <br />
                <span className="text-slate-400 font-semibold">
                  When APIs drift, your workflows stay alive.
                </span>
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                The biggest headache in automation is silent failure: Stripe or GitHub changes an API
                version, a field name alters, and your workflow crashes at 2 AM. Otter AI’s semantic
                engine detects missing keys and automatically bridges the gap while notifying you.
              </p>
              <ul className="space-y-2 pt-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Semantic field matching for renamed attributes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automatic payload repair logs sent directly to your notification hub</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero deadlocks or dropped customer events</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 Visual Card */}
            <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-bold">Otter Auto-Heal Log</span>
                  </div>
                  <span className="text-emerald-400 text-[10px]">Status: Repaired</span>
                </div>

                <div className="text-[11px] text-slate-400">
                  ⚠️ Incoming payload changed: key <code className="text-rose-400">user_email</code> was
                  not found.
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300">
                  ✓ AI auto-detected matching key: <code className="text-white">account.primary_email</code>.
                  Mapped automatically without dropping workflow execution.
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
                  <span>Latency penalty: +12ms</span>
                  <span>Execution ID: #88204-ok</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
