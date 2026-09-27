"use client";

import React, { use } from "react";
import { AgentStudio } from "@/components/AgentStudio";

export default function DocumentPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const resolvedParams = use(params);
  return <AgentStudio initialDocId={resolvedParams.docId} />;
}
