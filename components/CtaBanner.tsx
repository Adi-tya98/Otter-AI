"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles, Terminal } from "lucide-react";

export function CtaBanner() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 bg-gradient-to-b from-slate-900 via-slate-950 to-[#080c14] border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
          {/* Subtle glow background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get Started In Under 60 Seconds</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Ready to trade spaghetti nodes for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-teal-300 to-cyan-400">
                pure simplicity?
              </span>
            </h2>

            <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-xl mx-auto">
              Join thousands of developers, founders, and ops teams who ditched bloated automation
              tools for calm, reliable workflows.
            </p>

            {/* Email form or button */}
            {submitted ? (
              <div className="mt-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 max-w-md mx-auto flex items-center justify-center gap-2 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Welcome aboard! Check your inbox for your instant workspace link.</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your work email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-400 hover:brightness-110 shadow-lg shadow-amber-500/20 text-sm transition-all cursor-pointer"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Trust checklist */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                5 free workflows forever
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Deploy via Docker in 60s
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
