import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Otter AI — Workflow Automation Without The Chaos",
  description:
    "The simple, sane alternative to n8n and Zapier. Connect the essential 15 apps with an ultra-clean visual builder, zero JSON gymnastics, and native AI smarts.",
  keywords: [
    "workflow automation",
    "n8n alternative",
    "simple automation",
    "Zapier alternative",
    "AI workflows",
    "Otter AI",
    "low code automation",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full dark antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080c14] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300">
        {children}
      </body>
    </html>
  );
}
