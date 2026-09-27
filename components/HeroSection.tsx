"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Terminal,
  Check,
  Copy,
  Zap,
  ShieldCheck,
  Cpu,
  Boxes,
  Play
} from "lucide-react";

export function HeroSection() {
  const [copied, setCopied] = useState(false);
  const dockerCmd = "docker run -d -p 4200:4200 otterai/core:latest";

  const handleCopy = () => {
    navigator.clipboard.writeText(dockerCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
      {/* Background Radial Glows & Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-amber-500/15 via-cyan-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 shadow-inner backdrop-blur-md mb-8 group hover:border-amber-500/40 transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300">
              The Zen alternative to n8n & Zapier
            </span>
            <span className="text-slate-600">|</span>
            <a
              href="#simplicity"
              className="text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Why Less is More</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
            AI-agent applications,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-teal-300 to-cyan-400">
              stripped of the chaos.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            You do <strong>NOT</strong> construct complex workflows. Every agent in Otter AI has exactly three fixed components:
            <span className="text-cyan-300 font-semibold font-mono"> Trigger → AI Agent → Output</span>.
            The flow is completely fixed. You only configure the three components.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-400 hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all text-sm"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Try Live Interactive Sandbox</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#compare"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 transition-all text-sm"
            >
              <span>See n8n vs Otter Comparison</span>
            </a>
          </div>

          {/* Self-Host in 1 Line Command Pill */}
          <div className="mt-8 max-w-lg mx-auto">
            <div className="flex items-center justify-between p-2 pl-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-slate-400 truncate">
                <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-200 truncate">{dockerCmd}</span>
              </div>
              <button
                onClick={handleCopy}
                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              Single 38MB Docker container • Zero dependencies • SQLite / PostgreSQL ready
            </p>
          </div>

          {/* Micro-Features / Trust Pills */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">3-Minute Setup</div>
                <div className="text-[11px] text-slate-400">From zero to first live webhook</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Plain-English Mapping</div>
                <div className="text-[11px] text-slate-400">No cryptic JSON syntax</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">38MB RAM Footprint</div>
                <div className="text-[11px] text-slate-400">Runs on any $4/mo VPS</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Curated 15 Apps</div>
                <div className="text-[11px] text-slate-400">Tested daily, zero broken nodes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
