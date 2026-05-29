import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib/ai/constants";
import { buildSystemInstruction, buildWorkspaceContext } from "@/lib/ai/build-workspace-context";
import { getCurrentUser } from "@/lib/auth/session";
import type { User } from "@/lib/db/schema";
import { fetchMembers } from "@/lib/db/actions";

let genAI: GoogleGenerativeAI | null = null;

export interface AIResponse {
  action: "LOG_TASK" | "CONVERSATION" | "EDIT_TASK";
  conversationReply: string;
  proposedTask?: {
    title: string;
    description: string;
    assigneeId: string;
    projectId: string;
    dueDate: string;
    status: "TO_DO";
  };
}

type ChatMessage = { role: "user" | "assistant"; content: string };

function toGeminiHistory(messages: ChatMessage[]) {
  return messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Please set it in your environment variables." },
        { status: 500 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, messages, projectId } = body as {
      prompt?: string;
      messages?: ChatMessage[];
      projectId?: string;
    };

    const conversation: ChatMessage[] =
      messages?.length && messages[messages.length - 1]?.role === "user"
        ? messages
        : prompt
          ? [...(messages ?? []), { role: "user", content: prompt }]
          : [];

    const latestUserMessage = conversation[conversation.length - 1]?.content?.trim();
    if (!latestUserMessage) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const [workspaceContext, members] = await Promise.all([
      buildWorkspaceContext(projectId),
      fetchMembers(),
    ]);

    const systemInstruction = buildSystemInstruction(workspaceContext);

    if (!genAI) {
      genAI = new GoogleGenerativeAI(apiKey);
    }

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction,
    });

    const history = toGeminiHistory(conversation);

    let result;
    try {
      result = await model.generateContent({
        contents: [
          ...history,
          { role: "user", parts: [{ text: latestUserMessage }] },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      });
    } catch {
      result = await model.generateContent({
        contents: [
          ...history,
          { role: "user", parts: [{ text: latestUserMessage }] },
        ],
      });
    }

    const text = result.response.text().trim();
    let jsonText = text;

    if (jsonText.includes("```")) {
      const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) jsonText = match[1].trim();
    }
    if (!jsonText.startsWith("{")) {
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) jsonText = match[0];
    }

    let aiResponse: AIResponse;
    try {
      aiResponse = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse AI response as JSON:", jsonText);
      aiResponse = {
        action: "CONVERSATION",
        conversationReply:
          text ||
          "I'm having trouble formatting that answer. Could you ask again?",
      };
    }

    if (aiResponse.proposedTask?.assigneeId) {
      const assigneeExists = members.some(
        (m: User) => m.id === aiResponse.proposedTask!.assigneeId
      );
      if (!assigneeExists && members.length > 0) {
        const leastBusy = members.reduce((prev, curr) =>
          prev.tasksCount < curr.tasksCount ? prev : curr
        );
        aiResponse.proposedTask.assigneeId = leastBusy.id;
        aiResponse.conversationReply += ` I've assigned this to ${leastBusy.name} as they have the lightest workload.`;
      }
    }

    if (aiResponse.action === "LOG_TASK" && aiResponse.proposedTask) {
      const { fetchProjects } = await import("@/lib/db/project-actions");
      const projects = await fetchProjects();
      let resolvedProjectId = aiResponse.proposedTask.projectId || projectId;

      if (resolvedProjectId && !projects.some((p) => p.id === resolvedProjectId)) {
        resolvedProjectId = undefined;
      }
      if (!resolvedProjectId && projects.length === 1) {
        resolvedProjectId = projects[0].id;
      }
      if (!resolvedProjectId && projectId && projects.some((p) => p.id === projectId)) {
        resolvedProjectId = projectId;
      }

      if (!resolvedProjectId) {
        aiResponse = {
          action: "CONVERSATION",
          conversationReply:
            projects.length === 0
              ? "Create a project first — every task must belong to a project."
              : "Which project should this task go under? " +
                projects.map((p) => p.name).join(", "),
        };
      } else {
        aiResponse.proposedTask.projectId = resolvedProjectId;
      }
    }

    if (!aiResponse.conversationReply?.trim()) {
      aiResponse.conversationReply =
        "I processed your request but couldn't form a reply. Please try again.";
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
