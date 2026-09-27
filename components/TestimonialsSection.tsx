"use client";

import React from "react";
import { Star, MessageSquareQuote } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
  stat: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I spent three days trying to debug an infinite loop in n8n where a nested JSON array failed to map to Postgres. In Otter AI, I recreated the entire flow in four minutes. The plain-English mapping feels like magic.",
    author: "Elena Rostova",
    role: "VP of Engineering",
    company: "ScaleGrid.io",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    stat: "Saved 18 hrs/week",
  },
  {
    quote:
      "Zapier wanted $550/month because our webhooks processed 200,000 requests. Otter AI runs on a $5 DigitalOcean droplet taking 38MB of RAM, and the interface is 10x cleaner. Easily the best tech decision this quarter.",
    author: "Julian Chen",
    role: "Solo Founder",
    company: "FinFlow Analytics",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    stat: "Cut SaaS bill by 90%",
  },
  {
    quote:
      "The obsession with 800+ integrations in other tools is a trap. Most are broken community wrappers. Otter’s curated 15 apps work 100% of the time. If we ever need an odd API, the Smart HTTP block handles it instantly.",
    author: "David Moreau",
    role: "Head of Operations",
    company: "HyperLaunch",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    stat: "Zero downtime in 8 months",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 relative bg-slate-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1 text-amber-400 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400" />
            ))}
            <span className="text-xs font-semibold text-slate-300 ml-2">4.9 / 5 from 1,200+ builders</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Loved by teams who value{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400">
              simplicity over sprawl
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono font-bold">
                    {t.stat}
                  </span>
                  <MessageSquareQuote className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-white">{t.author}</div>
                  <div className="text-[11px] text-slate-400">
                    {t.role}, {t.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
