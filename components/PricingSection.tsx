"use client";

import React, { useState } from "react";
import { Check, Sparkles, Zap, ArrowRight } from "lucide-react";
import { GithubIcon } from "./SocialIcons";

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Fair & Predictable Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Simple plans.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">
              Zero runaway surprise bills.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            No punitive $500 monthly overages. Choose managed cloud or self-host free on your own
            hardware forever.
          </p>

          {/* Billing Frequency Switcher */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-full bg-slate-900 border border-slate-800">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                !annual ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                annual
                  ? "bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-slate-950/40 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Plan 1: Free Starter */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Starter</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Free Forever
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Perfect for hobbyists and solo makers running personal automations.
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-400">/ forever</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>5 active workflows</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2,500 executions / month</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All Curated 15 Integrations</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard webhook latency</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Community Discord support</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <a
                href="#demo"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <span>Start Free</span>
              </a>
            </div>
          </div>

          {/* Plan 2: Pro (Highlighted) */}
          <div className="p-8 rounded-3xl bg-slate-900/90 border-2 border-cyan-500/80 relative shadow-2xl shadow-cyan-500/10 flex flex-col justify-between">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Pro Builder</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                  Cloud Managed
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                For startups and lean teams demanding reliability, speed, and self-healing.
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">
                  ${annual ? "15" : "19"}
                </span>
                <span className="text-xs text-slate-400">/ month {annual && "(billed yearly)"}</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-800 text-xs text-slate-200">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-white">Unlimited active workflows</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>50,000 executions / month</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>AI Self-Healing Schema Repair</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Instant webhook delivery (&lt; 20ms)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>30-day execution logs & 1-click replay</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Priority email support</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <a
                href="#demo"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-400 hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all"
              >
                <span>Get Started with Pro</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Plan 3: Team */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Team & Scale</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  Shared
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Collaborative environments with team access control and high throughput.
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">
                  ${annual ? "39" : "49"}
                </span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited workflows & team seats</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>250,000 executions / month</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Shared Team Credentials Vault</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Role-based access control (RBAC)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dedicated high-throughput queues</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>99.9% uptime SLA guarantee</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <a
                href="#demo"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <span>Upgrade to Team</span>
              </a>
            </div>
          </div>
        </div>

        {/* Self-Hosted Callout */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
              <GithubIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Want to Self-Host for Free?</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                The core engine of Otter AI is 100% open source under Apache 2.0. Single binary or
                Docker container. Unlimited workflows on your own server.
              </p>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Explore GitHub Repo →
          </a>
        </div>
      </div>
    </section>
  );
}
