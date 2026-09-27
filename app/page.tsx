"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { InteractiveWorkflowEditor } from "@/components/InteractiveWorkflowEditor";
import { PainVsGainSection } from "@/components/PainVsGainSection";
import { SimplicityDeepDive } from "@/components/SimplicityDeepDive";
import { IntegrationsSection } from "@/components/IntegrationsSection";
import { VsComparisonTable } from "@/components/VsComparisonTable";
import { TemplatesGallery } from "@/components/TemplatesGallery";
import { RoiCalculator } from "@/components/RoiCalculator";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { PricingSection } from "@/components/PricingSection";
import { FaqSection } from "@/components/FaqSection";
import { CtaBanner } from "@/components/CtaBanner";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Sticky Glass Navbar */}
      <Navbar />

      {/* Main Landing Sections */}
      <main className="flex-1">
        {/* 1. Hero with headline, copyable docker snippet, and trust stats */}
        <HeroSection />

        {/* 2. Centerpiece Interactive Live Workflow Editor & Sandbox */}
        <InteractiveWorkflowEditor />

        {/* 3. The Philosophy: Why Less Integrations & Simpler Editor is a Superpower */}
        <PainVsGainSection />

        {/* 4. Deep Dive: Linear Flow, Plain-English Tags, and Self-Healing Engine */}
        <SimplicityDeepDive />

        {/* 5. The Curated 15 Apps with search, filters & Universal Webhook */}
        <IntegrationsSection />

        {/* 6. Direct Feature Matrix: Otter AI vs n8n vs Zapier vs Make */}
        <VsComparisonTable />

        {/* 7. Ready-to-Run Workflow Blueprints Gallery */}
        <TemplatesGallery />

        {/* 8. Interactive ROI & Engineering Time Saved Calculator */}
        <RoiCalculator />

        {/* 9. Testimonials & Builder Community Love */}
        <TestimonialsSection />

        {/* 10. Transparent Pricing (Free, Pro, Team, Self-Hosted) */}
        <PricingSection />

        {/* 11. Frequently Asked Questions Accordion */}
        <FaqSection />

        {/* 12. High-Impact Closing CTA Banner */}
        <CtaBanner />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
