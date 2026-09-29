"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { OtterLogo } from "./OtterLogo";
import {
  ArrowRight,
  Menu,
  X,
  Sparkles,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LogIn,
  UserPlus,
  Layers,
} from "lucide-react";
import { GithubIcon } from "./SocialIcons";
import { useAgentStore } from "@/store/agentStore";
import { useAuthStore } from "@/store/authStore";
import { AuthModal } from "./AuthModal";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { backendStatus, checkBackendStatus } = useAgentStore();
  const { user, isAuthenticated, openAuthModal, logout, verifySession } =
    useAuthStore();

  useEffect(() => {
    checkBackendStatus();
    verifySession();
  }, [checkBackendStatus, verifySession]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derive display initials
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : "U";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#080c14]/85 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/20 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <OtterLogo />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800 text-sm font-medium text-slate-300 backdrop-blur-md">
              <Link
                href="/usecases"
                className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Use Cases</span>
              </Link>
              <Link
                href="/docs"
                className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Docs</span>
              </Link>
              <a
                href="/#pricing"
                className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-slate-800/80 transition-all"
              >
                Pricing
              </a>
            </nav>

            {/* Right Action buttons */}
            <div className="hidden md:flex items-center gap-2.5">
              <a
                href="https://github.com/Adi-tya98/Otter-AI"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>Star</span>
                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-amber-400 font-mono">
                  4.8k
                </span>
              </a>
              {/* Authentication Controls */}
              {isAuthenticated && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-medium text-slate-200 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-lg bg-linear-to-tr from-amber-400 to-cyan-400 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                      {initials}
                    </div>
                    <span className="max-w-25 truncate">
                      {user.full_name || user.email.split("@")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 p-1.5 bg-[#0a0f1d] border border-slate-800 rounded-xl shadow-xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-slate-800/80">
                        <p className="text-xs font-semibold text-white truncate">
                          {user.full_name || "Otter Explorer"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors mt-1"
                      >
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Workflows Dashboard</span>
                      </Link>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openAuthModal("login")}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 text-slate-400" />
                    <span>Log In</span>
                  </button>
                  <button
                    onClick={() => openAuthModal("signup")}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 hover:border-cyan-600 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}

              <Link
                href="/dashboard"
                className="group relative inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-400 hover:brightness-110 rounded-lg shadow-sm shadow-amber-500/20 transition-all"
              >
                <span>Launch Studio</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 p-4 bg-slate-900/95 border border-slate-800 rounded-2xl backdrop-blur-xl flex flex-col gap-3 shadow-2xl">
              {/* Mobile Auth Status */}
              {isAuthenticated && user ? (
                <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-amber-400 to-cyan-400 text-slate-950 font-bold flex items-center justify-center text-xs">
                      {initials}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {user.full_name || user.email.split("@")[0]}
                      </p>
                      <p className="text-[10px] text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal("login");
                    }}
                    className="py-2 text-center text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-xl"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal("signup");
                    }}
                    className="py-2 text-center text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800 rounded-xl"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-cyan-300 font-semibold hover:bg-slate-800/80 rounded-lg flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                Workflows Dashboard
              </Link>

              <Link
                href="/usecases"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-cyan-300 font-semibold hover:bg-slate-800/80 rounded-lg flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Use Cases
              </Link>

              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-purple-300 font-semibold hover:bg-slate-800/80 rounded-lg flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                Documentation
              </Link>

              <a
                href="/#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 rounded-lg"
              >
                Pricing
              </a>
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-semibold text-slate-950 bg-linear-to-r from-amber-400 to-cyan-400 rounded-xl"
                >
                  Launch Studio
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Global Auth Modal */}
      <AuthModal />
    </>
  );
}
