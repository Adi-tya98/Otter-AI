"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Why build Otter AI when n8n and Zapier already exist?",
    a: "n8n is powerful, but it has become a bloated, complex tool. Setting up a simple workflow often requires drawing 15 crisscrossing nodes, writing custom JavaScript snippets, parsing raw JSON schemas, and running a 1.5GB Docker instance. Zapier, on the other hand, charges exorbitant rates as you scale. Otter AI was created for builders who want the 15 essential integrations that power 95% of software businesses, in a calm, linear editor with zero JSON headaches.",
  },
  {
    q: "What if I need an integration that isn't in your 'Curated 15'?",
    a: "You're never locked out! Otter includes a Smart Universal Webhook (inbound) and Smart HTTP Request block (outbound). Our built-in AI automatically detects the target API's schema, handles bearer authentication, formats the payload, and parses the response. You can connect to any REST API in 30 seconds without writing code.",
  },
  {
    q: "How does the 'Self-Healing AI' feature work?",
    a: "When third-party APIs update their webhook payloads (for instance, if an e-commerce platform changes a field from customer_email to user.billing_email), traditional tools throw a fatal 'undefined' error and halt. Otter's AI detects semantic field changes in real time, automatically maps the new structure, logs an alert, and ensures your critical business flow never crashes.",
  },
  {
    q: "Can I self-host Otter AI on my own infrastructure?",
    a: "Yes! Otter AI Core is 100% open source under Apache 2.0. Unlike n8n which requires NodeJS, heavy queues, and Redis to stay performant, Otter AI is packaged as a single lightweight ~38MB container. You can run it on a $4/mo VPS, a Raspberry Pi, or your local machine using SQLite or Postgres.",
  },
  {
    q: "Is it difficult to migrate my existing workflows?",
    a: "Most workflows in n8n or Zapier with 15+ nodes compress down to just 3 or 4 linear blocks in Otter AI because our AI nodes eliminate all the intermediary 'Function', 'Code', 'Merge', and 'JSON Parse' nodes. You can recreate your typical flows in 5 minutes.",
  },
  {
    q: "What are the limits on the Free Starter plan?",
    a: "Our free plan gives you 5 active workflows and 2,500 executions each month with access to all curated integrations. For personal projects, side hustles, and testing, it's more than enough. No credit card is required to sign up.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Everything you need to know about switching to simpler, sanity-first automation.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/70 border border-slate-800/80 overflow-hidden transition-all shadow-md"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-850/40 transition-colors"
                >
                  <span className="text-sm sm:text-base font-semibold text-white">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/50 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
