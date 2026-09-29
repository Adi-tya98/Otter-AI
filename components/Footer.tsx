"use client";

import React from "react";
import Link from "next/link";
import { OtterLogo } from "./OtterLogo";
import { GithubIcon, TwitterIcon, DiscordIcon } from "./SocialIcons";

export function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-[#060910] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <OtterLogo />
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Otter AI is the sane, simplified workflow automation platform designed for builders who
              refuse to wrestle with 800-node spaghetti graphs. Curated integrations, linear editor,
              and native AI smarts.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                aria-label="GitHub"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                aria-label="Twitter"
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                aria-label="Discord"
              >
                <DiscordIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#demo" className="hover:text-white transition-colors">
                  Interactive Sandbox
                </a>
              </li>
              <li>
                <Link href="/usecases" className="hover:text-white transition-colors">
                  Enterprise Use Cases
                </Link>
              </li>
              <li>
                <a href="#simplicity" className="hover:text-white transition-colors">
                  The Simplicity Manifesto
                </a>
              </li>
              <li>
                <a href="#integrations" className="hover:text-white transition-colors">
                  The Curated 15 Apps
                </a>
              </li>
              <li>
                <a href="#compare" className="hover:text-white transition-colors">
                  Otter vs. n8n
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Developers
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#demo" className="hover:text-white transition-colors">
                  Self-Hosting Docker
                </a>
              </li>
              <li>
                <a href="https://github.com" className="hover:text-white transition-colors">
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="#integrations" className="hover:text-white transition-colors">
                  Smart Webhook Engine
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Self-Healing Payloads
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  SQLite & Postgres Driver
                </a>
              </li>
            </ul>
          </div>

          {/* Company & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Trust</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Security Architecture
                </a>
              </li>
              <li>
                <div className="flex items-center gap-2 text-emerald-400 mt-2 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Systems Operational</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>© {new Date().getFullYear()} Otter AI Technologies Inc. All rights reserved.</div>
          <div className="flex items-center gap-1">
            <span>Built with simplicity & precision for builders everywhere.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
