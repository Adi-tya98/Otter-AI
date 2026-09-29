"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Sparkles,
  Search,
  Zap,
  ArrowRight,
  BarChart3,
  Database,
  Mail,
  MessageSquare,
  Globe,
  Terminal,
  Cpu,
  Layers,
  Coins,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  X,
  Sliders,
  DollarSign,
  Building2,
  Activity,
  Boxes,
} from "lucide-react";

// ============================================================================
// DATA TYPES
// ============================================================================

export type DomainCategory =
  | "all"
  | "marketing"
  | "devops"
  | "support"
  | "ecommerce"
  | "research";

export interface UseCaseItem {
  id: string;
  title: string;
  domain: "marketing" | "devops" | "support" | "ecommerce" | "research";
  domainLabel: string;
  tagline: string;
  description: string;
  businessImpact: {
    primaryMetric: string;
    metricLabel: string;
    roiHighlight: string;
  };
  tools: {
    name: string;
    badge: string;
    icon: string;
  }[];
  triggerType: "agentmail" | "webhook" | "chat" | "telegram" | "discord";
  triggerLabel: string;
  difficulty: "Beginner" | "Intermediate" | "Enterprise";
  deploymentTime: string;
  workflowSteps: {
    phase: string;
    description: string;
    toolsUsed: string[];
  }[];
  sampleTriggerPayload: string;
  sampleAgentOutput: string;
}

// ============================================================================
// CURATED ENTERPRISE USE CASES
// ============================================================================

const USE_CASES: UseCaseItem[] = [
  {
    id: "marketing-ad-spend-rebalancer",
    title: "Cross-Channel Ad Spend Rebalancer & ROAS Alerting",
    domain: "marketing",
    domainLabel: "Marketing & Growth",
    tagline: "Autonomous ad fatigue detection and budget reallocator across 100+ ad networks",
    description:
      "Constantly extracts multi-platform advertising metrics (Google Ads, Meta Ads, LinkedIn Ads) via Supermetrics. Automatically pauses fatigue ad variants, rebalances budget towards high-converting campaigns, and emails CMOs weekly ROI summaries via AgentMail.",
    businessImpact: {
      primaryMetric: "+28.4%",
      metricLabel: "Average Blended ROAS Increase",
      roiHighlight: "Eliminates ~20% of wasted ad spend within 48 hours of ad fatigue",
    },
    tools: [
      { name: "Supermetrics", badge: "100+ Ad Sources", icon: "BarChart3" },
      { name: "AgentMail", badge: "Threaded Email", icon: "Mail" },
      { name: "Discord", badge: "Live Webhook", icon: "MessageSquare" },
      { name: "HTTP Request", badge: "Rest API", icon: "Globe" },
    ],
    triggerType: "webhook",
    triggerLabel: "Scheduled Cron / Supermetrics Webhook",
    difficulty: "Intermediate",
    deploymentTime: "10 mins",
    workflowSteps: [
      {
        phase: "Trigger & Ingestion",
        description: "Runs on a 6-hour cron or marketing anomaly webhook trigger.",
        toolsUsed: ["Webhook Trigger"],
      },
      {
        phase: "Multi-Source Extraction",
        description: "Queries Google Ads (AW), Meta Ads (FA), and LinkedIn (LI) for spend, conversions, and CTR.",
        toolsUsed: ["Supermetrics Tool (run_query)"],
      },
      {
        phase: "Compound Reasoning",
        description: "LLM computes blended ROAS, pinpoints ads with CTR drop >30%, and recommends budget shifts.",
        toolsUsed: ["Groq Compound Agent"],
      },
      {
        phase: "Automated Execution & Reporting",
        description: "Dispatches instant alerts to Marketing Slack/Discord and emails formatted summary to leadership.",
        toolsUsed: ["Discord Tool", "AgentMail (send_message)"],
      },
    ],
    sampleTriggerPayload: JSON.stringify(
      {
        event: "scheduled_audit",
        timeframe: "last_7_days",
        target_sources: ["AW", "FA", "LI"],
        minimum_roas_threshold: 2.5,
      },
      null,
      2
    ),
    sampleAgentOutput:
      "## 📊 Marketing Performance Audit Report\n\n- **Total Spend Analyzed:** $34,850.00 across 3 channels.\n- **Identified Fatigue Ads:** 2 ad sets in Meta Ads with CTR dropped to 0.82%.\n- **Action Taken:** Paused Meta AdSet `FA_Retargeting_Q3` and shifted $2,500 daily budget to high-performing Google Ads `AW_Brand_Core` (ROAS 4.82).\n- **Leadership Alert:** Executive briefing dispatched to `cmo@enterprise.io` via AgentMail.",
  },
  {
    id: "support-agentmail-continuity",
    title: "Autonomous VIP Support Concierge with Threaded Continuity",
    domain: "support",
    domainLabel: "Customer Support",
    tagline: "Dedicated inbound email inbox resolving enterprise inquiries with zero ticket lag",
    description:
      "Dedicated AgentMail inbox receives inbound customer emails, extracts conversation threads, queries company Notion documentation and past resolution history, and dispatches empathetic, threaded email replies directly into the customer's inbox.",
    businessImpact: {
      primaryMetric: "78%",
      metricLabel: "Tier-1 Inbound Deflection",
      roiHighlight: "Reduces first-response SLA from 4 hours to under 35 seconds",
    },
    tools: [
      { name: "AgentMail", badge: "agentmail.to", icon: "Mail" },
      { name: "Notion", badge: "Granular Knowledge", icon: "Boxes" },
      { name: "Telegram", badge: "On-Call Alerts", icon: "MessageSquare" },
      { name: "Web Search", badge: "DuckDuckGo", icon: "Search" },
    ],
    triggerType: "agentmail",
    triggerLabel: "AgentMail Inbound Webhook (message.received)",
    difficulty: "Beginner",
    deploymentTime: "5 mins",
    workflowSteps: [
      {
        phase: "Email Arrival",
        description: "Customer emails `support@agentmail.to`. Real-time webhook fires with thread ID.",
        toolsUsed: ["AgentMail Trigger"],
      },
      {
        phase: "Context Retrieval",
        description: "Agent searches internal Notion databases for account tier, SLA requirements, and relevant docs.",
        toolsUsed: ["Notion Tool (workspace_search)"],
      },
      {
        phase: "Synthesize & Draft Solution",
        description: "Agent creates a personalized, professional solution respecting customer tier.",
        toolsUsed: ["Groq Compound Agent"],
      },
      {
        phase: "Threaded Reply",
        description: "Dispatches response directly to original customer email thread, maintaining email client continuity.",
        toolsUsed: ["AgentMail (reply_message)"],
      },
    ],
    sampleTriggerPayload: JSON.stringify(
      {
        event: "message.received",
        from: "sarah.chen@clientcorp.com",
        subject: "Urgent: Webhook signature verification failing in prod",
        thread_id: "th_98ab4401c",
        text: "Hi team, our webhook calls started returning 401s after rotating our HMAC secret. Can you verify our key format?",
      },
      null,
      2
    ),
    sampleAgentOutput:
      "Hi Sarah,\n\nThanks for reaching out! Looking at your enterprise account, after rotating your webhook HMAC key, please ensure the header `X-Otter-Signature-256` uses raw hex encoding rather than base64.\n\nHere is the updated verification snippet from our documentation:\n```python\nhashlib.sha256(secret.encode()).hexdigest()\n```\n\nIf this persists, I have alerted our on-call engineering lead via Telegram to assist you directly.",
  },
  {
    id: "devops-mongodb-sre",
    title: "Self-Healing MongoDB Atlas SRE & Disaster Mitigation Agent",
    domain: "devops",
    domainLabel: "Cloud & DevOps",
    tagline: "Autonomous database health guardian, slow query optimizer, and cluster scaler",
    description:
      "Monitors MongoDB Atlas clusters for memory spikes, connection pool exhaustion, and replication lag. Executes aggregation pipeline diagnostics, flags unindexed collections, and alerts engineering teams on Discord with remediation steps.",
    businessImpact: {
      primaryMetric: "94%",
      metricLabel: "Reduction in MTTR for DB Incidents",
      roiHighlight: "Eliminates midnight on-call pager fatigue with autonomous diagnostics",
    },
    tools: [
      { name: "MongoDB & Atlas", badge: "pymongo & Atlas API", icon: "Database" },
      { name: "Discord", badge: "Incident Channel", icon: "MessageSquare" },
      { name: "HTTP Request", badge: "OpsGenie / PagerDuty", icon: "Globe" },
      { name: "Notion", badge: "Postmortem Log", icon: "Boxes" },
    ],
    triggerType: "webhook",
    triggerLabel: "Prometheus / Atlas Alert Webhook",
    difficulty: "Enterprise",
    deploymentTime: "15 mins",
    workflowSteps: [
      {
        phase: "Alert Ingestion",
        description: "Atlas Webhook or Datadog alert triggers on CPU > 85% or slow query queue.",
        toolsUsed: ["Webhook Trigger"],
      },
      {
        phase: "Cluster State Inspection",
        description: "Agent connects to MongoDB Atlas Administration API to check cluster tier and health state.",
        toolsUsed: ["MongoDB Tool (atlas_cluster_status)"],
      },
      {
        phase: "Diagnostics & Aggregation",
        description: "Executes diagnostic queries on collections and system profile logs to find slow queries.",
        toolsUsed: ["MongoDB Tool (aggregate, count_documents)"],
      },
      {
        phase: "Remediation & Logging",
        description: "Posts incident summary and suggested compound indexes to Discord; creates Notion postmortem.",
        toolsUsed: ["Discord Tool", "Notion Tool (create_database_page)"],
      },
    ],
    sampleTriggerPayload: JSON.stringify(
      {
        alert_name: "MongoDB_Atlas_High_Memory",
        cluster_name: "Cluster-Production-East",
        current_memory_percent: 89.4,
        active_connections: 1420,
      },
      null,
      2
    ),
    sampleAgentOutput:
      "🚨 **MongoDB Atlas Incident Diagnostic**\n\n- **Cluster:** `Cluster-Production-East` (M30, AWS US-East-1)\n- **State:** `UPDATING / HIGH LOAD` (89.4% RAM)\n- **Root Cause:** Collection `orders` experienced unindexed query scan on `{'customer_id': '...', 'status': 'pending'}` scanning 450,000 documents.\n- **Recommended Fix:** Add compound index `{ customer_id: 1, status: 1 }`.\n- **Incident Ticket:** Automatically logged in Notion Engineering Postmortems.",
  },
  {
    id: "ecommerce-abandoned-cart",
    title: "Omnichannel Cart Recovery & Dynamic Currency Pricing Engine",
    domain: "ecommerce",
    domainLabel: "E-Commerce & FinOps",
    tagline: "Dynamic localized incentives converting high-intent abandoned checkout carts",
    description:
      "When a shopper abandons a high-value cart, the agent queries their purchase history from MongoDB, fetches live FX rates with Currency Converter, generates an individualized tiered discount, and sends an engaging recovery email via Resend.",
    businessImpact: {
      primaryMetric: "+19.2%",
      metricLabel: "Recovered Cart Revenue",
      roiHighlight: "Recovers an average of $38,000/month for mid-market merchants",
    },
    tools: [
      { name: "MongoDB", badge: "Customer Data", icon: "Database" },
      { name: "Currency Converter", badge: "Live FX Rates", icon: "Coins" },
      { name: "Resend Email", badge: "Transactional", icon: "Mail" },
      { name: "Supermetrics", badge: "Shopify Orders", icon: "BarChart3" },
    ],
    triggerType: "webhook",
    triggerLabel: "Shopify / Stripe Cart Abandonment Webhook",
    difficulty: "Intermediate",
    deploymentTime: "12 mins",
    workflowSteps: [
      {
        phase: "Abandonment Event",
        description: "Webhook fires 45 minutes after checkout session goes inactive with cart value > $100.",
        toolsUsed: ["Webhook Trigger"],
      },
      {
        phase: "Customer Lifetime Profiling",
        description: "Queries MongoDB `customers` collection to evaluate prior orders and lifetime loyalty value.",
        toolsUsed: ["MongoDB Tool (find_one)"],
      },
      {
        phase: "Dynamic FX & Incentive",
        description: "Calculates local pricing using Currency Converter and personalizes coupon code.",
        toolsUsed: ["Currency Converter Tool"],
      },
      {
        phase: "Dispatch Transactional Recovery",
        description: "Sends customized HTML recovery email highlighting the specific items with 1-click restore.",
        toolsUsed: ["Resend Email Tool"],
      },
    ],
    sampleTriggerPayload: JSON.stringify(
      {
        cart_id: "cart_998129",
        customer_email: "marcus.k@berlin-tech.de",
        base_currency: "USD",
        cart_total_usd: 249.0,
        items: ["Ergonomic Mechanical Keyboard", "Ultra-wide Desk Mat"],
      },
      null,
      2
    ),
    sampleAgentOutput:
      "✅ **Cart Recovery Processed**\n- **Target Customer:** Marcus (VIP Tier, 3 prior orders)\n- **Currency Conversion:** $249.00 USD converted to **€229.80 EUR** at live mid-market rate.\n- **Incentive Generated:** 10% loyalty discount code `MARCUS10` (valid for 24h).\n- **Delivery:** Sent beautiful HTML checkout link via Resend.",
  },
  {
    id: "research-competitive-radar",
    title: "Competitive Intelligence Radar & Automated Executive Digest",
    domain: "research",
    domainLabel: "Market Intelligence",
    tagline: "Autonomous deep-web scraper tracking competitor pricing, features, and docs",
    description:
      "Periodically scrapes competitor changelogs and pricing tiers using Jina AI Reader, conducts live web searches for market buzz, updates a structured competitive matrix in Notion, and sends executive summaries via AgentMail.",
    businessImpact: {
      primaryMetric: "15 hrs/wk",
      metricLabel: "Product Marketing Time Saved",
      roiHighlight: "Zero blind spots on competitor pricing changes and release announcements",
    },
    tools: [
      { name: "Jina AI Reader", badge: "Clean Markdown", icon: "Cpu" },
      { name: "Live Web Search", badge: "DuckDuckGo", icon: "Search" },
      { name: "Notion", badge: "Competitive Matrix", icon: "Boxes" },
      { name: "AgentMail", badge: "Weekly Briefing", icon: "Mail" },
    ],
    triggerType: "chat",
    triggerLabel: "Weekly Scheduled Cron / On-Demand Chat",
    difficulty: "Beginner",
    deploymentTime: "8 mins",
    workflowSteps: [
      {
        phase: "Target Scrape",
        description: "Fetches clean Markdown from 5 key competitor pricing and product changelog URLs.",
        toolsUsed: ["Jina Reader Tool"],
      },
      {
        phase: "Sentiment & News Scan",
        description: "Executes DuckDuckGo search queries for recent discussions, Hacker News threads, and reviews.",
        toolsUsed: ["Web Search Tool"],
      },
      {
        phase: "Matrix Extraction & Diffing",
        description: "LLM compares extracted pricing tiers against previous records to highlight changes.",
        toolsUsed: ["Groq Compound Agent"],
      },
      {
        phase: "Sync & Broadcast",
        description: "Updates Notion database row and emails summary to the Product Strategy distribution list.",
        toolsUsed: ["Notion Tool", "AgentMail Tool"],
      },
    ],
    sampleTriggerPayload: JSON.stringify(
      {
        query: "Audit competitor tier changes for Q4 across our top 3 rivals",
        competitors: ["Competitor A (SaaS)", "Competitor B (Enterprise)"],
      },
      null,
      2
    ),
    sampleAgentOutput:
      "## 🎯 Competitive Intelligence Briefing\n\n1. **Competitor A:** Added a new 'Scale' tier at $199/mo with unlimited API seats (previously capped at 10 seats).\n2. **Competitor B:** Launched native Model Context Protocol (MCP) server support on their GitHub org yesterday.\n3. **Action:** Updated Notion Competitive Matrix with new feature comparisons; sent weekly briefing to Product Leadership via AgentMail.",
  },
  {
    id: "devops-mcp-developer-gateway",
    title: "Multi-Model Cloud & Stdio MCP Developer Gateway",
    domain: "devops",
    domainLabel: "Cloud & DevOps",
    tagline: "Unified agentic hub orchestrating Vercel, GitHub, and local CLI subprocesses via MCP",
    description:
      "Connects standard Model Context Protocol (MCP) servers (Vercel MCP, MongoDB MCP, Supermetrics MCP, or local CLI stdio tools) directly to Groq compound reasoning with automatic tool schema capping and zero-leak fallback handling.",
    businessImpact: {
      primaryMetric: "100%",
      metricLabel: "MCP Standard Compliance",
      roiHighlight: "Eliminates custom API glue code; connect any existing MCP server in 30 seconds",
    },
    tools: [
      { name: "Model Context Protocol", badge: "Stdio & HTTP SSE", icon: "Terminal" },
      { name: "Vercel MCP", badge: "Deployments", icon: "Globe" },
      { name: "MongoDB MCP", badge: "Cluster CLI", icon: "Database" },
      { name: "Supermetrics MCP", badge: "Enterprise MCP", icon: "BarChart3" },
    ],
    triggerType: "chat",
    triggerLabel: "Interactive Terminal / Developer Chat",
    difficulty: "Enterprise",
    deploymentTime: "5 mins",
    workflowSteps: [
      {
        phase: "MCP Server Handshake",
        description: "Agent connects to remote HTTP/SSE or local Stdio subprocess and discovers tools schema.",
        toolsUsed: ["MCPClient"],
      },
      {
        phase: "Hybrid Compilation",
        description: "Merges local tools with external MCP server tools, capping safely at 128 tools for Groq.",
        toolsUsed: ["NodeFactory (create_node)"],
      },
      {
        phase: "Autonomous Routing",
        description: "Agent determines whether to call native local Python functions or dispatch JSON-RPC to MCP.",
        toolsUsed: ["AgentEngine", "Structured Logger"],
      },
      {
        phase: "Execution & Feedback",
        description: "Dispatches commands, triggers previews, and returns unified terminal feedback.",
        toolsUsed: ["Terminal / Chat Output"],
      },
    ],
    sampleTriggerPayload: JSON.stringify(
      {
        prompt: "Check deployment status for frontend on Vercel and verify latest documents in MongoDB Atlas",
        mcp_servers: ["Vercel MCP", "MongoDB MCP"],
      },
      null,
      2
    ),
    sampleAgentOutput:
      "🚀 **MCP Hybrid Orchestration Completed**\n\n- **Vercel MCP (`get_deployment_status`):** Deployment `dpl_99a812bc` is READY (Preview: `https://frontend-git-feat.vercel.app`).\n- **MongoDB MCP (`list_collections`):** 14 collections active in `production_db`; cluster health state is IDLE.\n- **Latency:** Both MCP calls resolved in 240ms over persistent JSON-RPC transport.",
  },
  {
    id: "marketing-lead-enrichment",
    title: "High-Velocity Inbound Lead Scoring & Instant CRM Enrichment",
    domain: "marketing",
    domainLabel: "Marketing & Growth",
    tagline: "Qualify, research, and outreach to high-value enterprise leads within 60 seconds",
    description:
      "When a new lead fills out a contact form, the agent searches the web for recent company funding, tech stack, and LinkedIn headcount, scores the lead in a Notion CRM pipeline, and sends an executive intro email via AgentMail.",
    businessImpact: {
      primaryMetric: "3.4x",
      metricLabel: "Increase in Lead Qualification Velocity",
      roiHighlight: "First touch in under 60 seconds boosts prospect conversion rate by 391%",
    },
    tools: [
      { name: "Live Web Search", badge: "Company Intelligence", icon: "Search" },
      { name: "Notion", badge: "CRM Pipeline", icon: "Boxes" },
      { name: "AgentMail", badge: "Personalized Outreach", icon: "Mail" },
      { name: "Supermetrics", badge: "Ad Attribution", icon: "BarChart3" },
    ],
    triggerType: "webhook",
    triggerLabel: "Typeform / Webhook Form Submission",
    difficulty: "Intermediate",
    deploymentTime: "10 mins",
    workflowSteps: [
      {
        phase: "Inbound Form Trigger",
        description: "Webhook fires with lead name, business email, and company domain.",
        toolsUsed: ["Webhook Trigger"],
      },
      {
        phase: "Deep Web Enrichment",
        description: "Searches DuckDuckGo for recent funding, company size, and executive leadership.",
        toolsUsed: ["Web Search Tool"],
      },
      {
        phase: "CRM Pipeline Recording",
        description: "Creates formatted deal card in Notion CRM with calculated Lead Quality Score.",
        toolsUsed: ["Notion Tool (create_database_page)"],
      },
      {
        phase: "Immediate Personalized Touch",
        description: "Drafts tailored email referencing company achievements and dispatches via AgentMail.",
        toolsUsed: ["AgentMail Tool (send_message)"],
      },
    ],
    sampleTriggerPayload: JSON.stringify(
      {
        email: "vp.engineering@fintech-unicorn.com",
        name: "Alex Rivera",
        company: "Fintech Unicorn",
        inquiry: "Looking to deploy autonomous agents for our KYC review workflows",
      },
      null,
      2
    ),
    sampleAgentOutput:
      "🎯 **Lead Enriched & Scored**\n- **Lead:** Alex Rivera (VP Engineering, Fintech Unicorn)\n- **Company Intel:** Series B ($42M raised), 120 employees, uses AWS & MongoDB.\n- **Score:** **Tier-1 Enterprise (96/100)**.\n- **CRM Action:** Created deal card in Notion Enterprise Pipeline.\n- **Outreach:** Personalized calendar booking link dispatched via AgentMail.",
  },
  {
    id: "support-discord-telegram-concierge",
    title: "Omnichannel Discord & Telegram Developer Community Concierge",
    domain: "support",
    domainLabel: "Customer Support",
    tagline: "24/7 AI moderator and technical knowledge base assistant for developer communities",
    description:
      "Monitors Discord channels and Telegram support groups in real time. Answers complex developer questions with code snippets using verified Notion documentation and searches the web for recent release notes.",
    businessImpact: {
      primaryMetric: "99.9%",
      metricLabel: "Community Presence Uptime",
      roiHighlight: "Reduces community manager workload by 25+ hours per week",
    },
    tools: [
      { name: "Discord", badge: "Bi-Directional Bot", icon: "MessageSquare" },
      { name: "Telegram", badge: "Community Chat", icon: "MessageSquare" },
      { name: "Notion", badge: "Developer Guides", icon: "Boxes" },
      { name: "Web Search", badge: "GitHub Docs", icon: "Search" },
    ],
    triggerType: "discord",
    triggerLabel: "Discord Message / Telegram Webhook",
    difficulty: "Intermediate",
    deploymentTime: "12 mins",
    workflowSteps: [
      {
        phase: "Question Detected",
        description: "User asks technical question in `#troubleshooting` Discord channel.",
        toolsUsed: ["Discord Trigger / Reader"],
      },
      {
        phase: "Documentation Lookup",
        description: "Agent searches internal Notion technical guides and API references.",
        toolsUsed: ["Notion Tool"],
      },
      {
        phase: "Code Snippet Generation",
        description: "LLM crafts minimal reproducible code sample solving user's issue.",
        toolsUsed: ["Groq Compound Agent"],
      },
      {
        phase: "Channel Response",
        description: "Replies directly in thread or channel with markdown formatted explanation.",
        toolsUsed: ["Discord Tool (send_message)"],
      },
    ],
    sampleTriggerPayload: JSON.stringify(
      {
        author: "DevUser#4021",
        channel_id: "123456789012345678",
        message: "How do I configure MongoDB Atlas Data API fallback with Otter AI workflows?",
      },
      null,
      2
    ),
    sampleAgentOutput:
      "Hey @DevUser! You can configure MongoDB Atlas fallback by supplying your `atlas_data_api_url` and `atlas_data_api_key` in the MongoDB Tool configuration. When `pymongo` is not present, the tool automatically routes queries over HTTPS directly to MongoDB App Services endpoints!",
  },
];

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function UseCasesPage() {
  const [selectedDomain, setSelectedDomain] = useState<DomainCategory>("all");
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalUseCase, setActiveModalUseCase] = useState<UseCaseItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Available tool filters derived dynamically
  const allUniqueTools = useMemo(() => {
    const set = new Set<string>();
    USE_CASES.forEach((item) => item.tools.forEach((t) => set.add(t.name)));
    return Array.from(set);
  }, []);

  // Filtered use cases
  const filteredUseCases = useMemo(() => {
    return USE_CASES.filter((item) => {
      // Domain filter
      if (selectedDomain !== "all" && item.domain !== selectedDomain) {
        return false;
      }
      // Tool filter
      if (
        selectedToolFilter !== "all" &&
        !item.tools.some((t) => t.name.toLowerCase() === selectedToolFilter.toLowerCase())
      ) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchTagline = item.tagline.toLowerCase().includes(q);
        const matchTools = item.tools.some((t) => t.name.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTagline && !matchTools) {
          return false;
        }
      }
      return true;
    });
  }, [selectedDomain, selectedToolFilter, searchQuery]);

  const handleCopyPayload = (payload: string, id: string) => {
    navigator.clipboard.writeText(payload);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        {/* ================================================================= */}
        {/* HERO SECTION */}
        {/* ================================================================= */}
        <section className="relative overflow-hidden pt-12 pb-16 border-b border-slate-800/80">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-purple-600/15 via-cyan-500/15 to-blue-600/15 blur-3xl pointer-events-none rounded-full" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-6 shadow-md shadow-cyan-500/10">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Enterprise Agent Blueprints & Multi-Domain Solutions</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
              Automate Any Business Process with{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                Autonomous AI Agents
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Explore battle-tested use cases across marketing, infrastructure, customer support, and financial operations. Connect 100+ platforms with Supermetrics, MongoDB Atlas, AgentMail, Notion, Discord, and Model Context Protocol (MCP) servers.
            </p>

            {/* Quick Metrics Bar */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">100+</div>
                <div className="text-xs text-slate-400 mt-1">Marketing Data Sources</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">&lt;45s</div>
                <div className="text-xs text-slate-400 mt-1">First Response SLA</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">85%</div>
                <div className="text-xs text-slate-400 mt-1">Hours Reclaimed</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">Zero</div>
                <div className="text-xs text-slate-400 mt-1">Code Lock-in (MCP)</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Build in Studio</span>
              </Link>
              <a
                href="#usecases-grid"
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-sm font-semibold transition-all cursor-pointer"
              >
                Browse All Blueprints
              </a>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* INTERACTIVE FILTERS & SEARCH */}
        {/* ================================================================= */}
        <section id="usecases-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800/80">
            {/* Domain Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {[
                { id: "all", label: "All Domains" },
                { id: "marketing", label: "Marketing & Growth" },
                { id: "devops", label: "Cloud & DevOps" },
                { id: "support", label: "Customer Support" },
                { id: "ecommerce", label: "E-Commerce & FinOps" },
                { id: "research", label: "Market Intelligence" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedDomain(tab.id as DomainCategory)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedDomain === tab.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20"
                      : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & Tool Filter */}
            <div className="flex items-center gap-3">
              {/* Tool dropdown */}
              <div className="relative">
                <select
                  value={selectedToolFilter}
                  onChange={(e) => setSelectedToolFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="all">All Tools</option>
                  {allUniqueTools.map((tool) => (
                    <option key={tool} value={tool}>
                      {tool}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search use cases..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 mb-6">
            <span>
              Showing <strong className="text-white">{filteredUseCases.length}</strong> enterprise use cases
            </span>
            {(selectedDomain !== "all" || selectedToolFilter !== "all" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedDomain("all");
                  setSelectedToolFilter("all");
                  setSearchQuery("");
                }}
                className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* =============================================================== */}
          {/* USE CASES GRID */}
          {/* =============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUseCases.map((item) => (
              <div
                key={item.id}
                className="group p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between shadow-lg shadow-black/20 hover:shadow-cyan-500/5 relative"
              >
                <div>
                  {/* Header / Domain & Trigger Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30">
                      {item.domainLabel}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ⏱ {item.deploymentTime} setup
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium italic">
                    "{item.tagline}"
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Business Impact Metric Callout */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-[11px] text-slate-400 font-medium">Business ROI Highlight</div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-lg font-extrabold text-emerald-400">
                        {item.businessImpact.primaryMetric}
                      </span>
                      <span className="text-xs text-slate-300">
                        {item.businessImpact.metricLabel}
                      </span>
                    </div>
                  </div>

                  {/* Tools Involved */}
                  <div className="mt-4">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                      Tools & Integrations
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tools.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-200 font-medium flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer / Action */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setActiveModalUseCase(item)}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Architecture</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    href="/dashboard"
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700/70 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Deploy</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredUseCases.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-dashed border-slate-800">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No use cases match your filters</h3>
              <p className="text-xs text-slate-400 mt-1">Try resetting the domain or tool filter.</p>
              <button
                onClick={() => {
                  setSelectedDomain("all");
                  setSelectedToolFilter("all");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* INTERACTIVE ROI & SAVINGS CALCULATOR */}
        {/* ================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900/90 via-purple-950/20 to-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="max-w-3xl">
              <span className="text-xs font-bold tracking-wider uppercase text-purple-400">
                Enterprise ROI Impact
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">
                Calculate How Much Autonomous Agents Save Your Organization
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                By automating repetitive cross-channel analytics, ticket triage, and database operations with dedicated agent tools, enterprise teams reclaim hundreds of engineering hours every month.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800/80">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Time Reclaimed</span>
                </div>
                <div className="text-3xl font-extrabold text-white">120+ hrs</div>
                <p className="text-xs text-slate-400 mt-1">
                  Saved per analyst or engineer monthly from routine manual auditing and data entry.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Cost Reduction</span>
                </div>
                <div className="text-3xl font-extrabold text-white">$145,000</div>
                <p className="text-xs text-slate-400 mt-1">
                  Average annual operations savings per 50-person enterprise department.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Error Rate</span>
                </div>
                <div className="text-3xl font-extrabold text-white">&lt;0.01%</div>
                <p className="text-xs text-slate-400 mt-1">
                  Zero transcription errors across database mutations and marketing ad spend updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* CLOSING CTA BANNER */}
        {/* ================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ready to Build Your Custom Autonomous Workflow?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-2">
              Launch directly into the Studio to chain Supermetrics, MongoDB, AgentMail, Notion, Discord, and MCP servers with visual linear simplicity.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                Launch Workflow Studio
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* =================================================================== */}
      {/* DETAILED ARCHITECTURE MODAL */}
      {/* =================================================================== */}
      {activeModalUseCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0f1d] border border-slate-700 p-6 sm:p-8 shadow-2xl relative text-left">
            {/* Close Button */}
            <button
              onClick={() => setActiveModalUseCase(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Domain & Meta */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {activeModalUseCase.domainLabel}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeModalUseCase.difficulty} • {activeModalUseCase.deploymentTime}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {activeModalUseCase.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium italic">
              "{activeModalUseCase.tagline}"
            </p>

            {/* Full Description */}
            <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed">
              {activeModalUseCase.description}
            </p>

            {/* Architecture Pipeline Flow */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Execution Pipeline & Step-by-Step Architecture</span>
              </h4>

              <div className="space-y-2.5">
                {activeModalUseCase.workflowSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{step.phase}</span>
                        <div className="flex gap-1">
                          {step.toolsUsed.map((tool, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Trigger Payload */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sample Trigger Event Payload</span>
                </span>
                <button
                  onClick={() =>
                    handleCopyPayload(
                      activeModalUseCase.sampleTriggerPayload,
                      activeModalUseCase.id
                    )
                  }
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-mono"
                >
                  {copiedId === activeModalUseCase.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                {activeModalUseCase.sampleTriggerPayload}
              </pre>
            </div>

            {/* Sample Output */}
            <div className="mt-6">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Sample Agent Reasoning & Final Output</span>
              </span>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {activeModalUseCase.sampleAgentOutput}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModalUseCase(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Close
              </button>
              <Link
                href="/dashboard"
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Deploy in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
