import { StateCreator } from "zustand";
import { WorkflowChatMessage } from "../types/agentTypes";
import type { AgentStoreState } from "../agentStore";

export interface ChatSlice {
  isChatSidebarOpen: boolean;
  chatMessages: WorkflowChatMessage[];

  openChatSidebar: (initialPrompt?: string) => void;
  closeChatSidebar: () => void;
  clearChatMessages: () => void;
  sendWorkflowChatMessage: (messageText: string) => Promise<void>;
}

export const createChatSlice: StateCreator<
  AgentStoreState,
  [],
  [],
  ChatSlice
> = (set, get) => ({
  isChatSidebarOpen: false,
  chatMessages: [],

  openChatSidebar: (initialPrompt?: string) => {
    const current = get().getActiveAgent();
    set({ isChatSidebarOpen: true });

    if (get().chatMessages.length === 0) {
      const welcome =
        current.trigger.chatSettings?.welcomeMessage ||
        `Hi! I'm connected to ${current.name}. How can I assist you with this workflow today?`;
      set({
        chatMessages: [
          {
            id: `msg-welcome-${Date.now()}`,
            role: "agent",
            content: welcome,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ],
      });
    }

    if (initialPrompt && initialPrompt.trim()) {
      get().sendWorkflowChatMessage(initialPrompt.trim());
    }
  },

  closeChatSidebar: () => {
    set({ isChatSidebarOpen: false });
  },

  clearChatMessages: () => {
    const current = get().getActiveAgent();
    const welcome =
      current.trigger.chatSettings?.welcomeMessage ||
      `Hi! I'm connected to ${current.name}. How can I assist you with this workflow today?`;
    set({
      chatMessages: [
        {
          id: `msg-welcome-${Date.now()}`,
          role: "agent",
          content: welcome,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
    });
  },

  sendWorkflowChatMessage: async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || get().isRunning) return;

    const userMsgId = `msg-user-${Date.now()}`;
    const userMsg: WorkflowChatMessage = {
      id: userMsgId,
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg],
    }));

    const startTime = Date.now();

    // Execute through unified execution (Backend or fallback simulation)
    await get().runSimulation(trimmed);

    const durationMs = Date.now() - startTime;
    const currentDoc = get().getActiveAgent();

    if (get().backendError) {
      const errorMsg: WorkflowChatMessage = {
        id: `msg-agent-${Date.now()}`,
        role: "agent",
        content: `⚠️ **Workflow Execution Error**:\n\n\`\`\`\n${get().backendError}\n\`\`\`\nPlease check your node configurations or tool parameters.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        durationMs,
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, errorMsg],
      }));
      return;
    }

    const rawReply =
      currentDoc.agent.sampleOutput?.final_output ||
      currentDoc.output.sampleResult?.rendered_reply ||
      currentDoc.agent.sampleOutput?.agent_answer ||
      currentDoc.output.sampleResult?.rendered_bubble ||
      "Workflow executed successfully.";

    const replyText =
      typeof rawReply === "object"
        ? JSON.stringify(rawReply, null, 2)
        : String(rawReply ?? "");

    const rawTools =
      currentDoc.agent.sampleOutput?.tools_used ||
      currentDoc.agent.tools.filter((t) => t.enabled).map((t) => t.name);

    const toolsUsed = Array.isArray(rawTools)
      ? rawTools.map((t: any) =>
          typeof t === "string" ? t : (t?.name || "tool"),
        )
      : undefined;

    const agentMsg: WorkflowChatMessage = {
      id: `msg-agent-${Date.now()}`,
      role: "agent",
      content: replyText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      toolsUsed: toolsUsed && toolsUsed.length > 0 ? toolsUsed : undefined,
      durationMs,
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, agentMsg],
    }));
  },
});
