import { createServerFn } from "@tanstack/react-start";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "openai/gpt-5.5";

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key)(MODEL);
}

const EmailInput = z.object({
  recipient: z.string().min(1),
  subject: z.string().min(1),
  purpose: z.string().min(1),
  tone: z.enum(["Formal", "Friendly", "Persuasive"]),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => EmailInput.parse(data))
  .handler(async ({ data }) => {
    const { text } = await generateText({
      model: getModel(),
      system:
        "You are a professional workplace email writer. Produce a complete, ready-to-send email with a clear subject line and sign-off. Return only the email text, no commentary.",
      prompt: `Write an email with the following details:
Recipient: ${data.recipient}
Subject: ${data.subject}
Purpose: ${data.purpose}
Tone: ${data.tone}`,
    });
    return { text };
  });

const AnalyzeInput = z.object({
  recipient: z.string(),
  subject: z.string(),
  emailText: z.string().min(1),
});

const AnalyzeSchema = z.object({
  projectName: z
    .string()
    .describe(
      "The main project, initiative, or deliverable discussed. Empty string if none.",
    ),
  tasks: z
    .array(z.string())
    .describe(
      "Concrete action items or to-dos mentioned or implied in the email, phrased as short imperative task titles. Empty if none.",
    ),
});

export const analyzeEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AnalyzeInput.parse(data))
  .handler(async ({ data }) => {
    const { object } = await generateObject({
      model: getModel(),
      schema: AnalyzeSchema,
      system:
        "Extract the discussed project name and any actionable tasks from a workplace email. Be conservative: only include real, concrete tasks. Keep task titles under 12 words.",
      prompt: `Subject: ${data.subject}
Recipient: ${data.recipient}

Email:
${data.emailText}`,
    });
    return object;
  });

const FollowUpInput = z.object({
  recipient: z.string().min(1),
  originalSubject: z.string().min(1),
  project: z.string().default(""),
  originalEmail: z.string().min(1),
});

export const generateFollowUpEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => FollowUpInput.parse(data))
  .handler(async ({ data }) => {
    const { text } = await generateText({
      model: getModel(),
      system:
        "You are a professional email writer. Draft a polite, concise 48-hour follow-up email that references the earlier message, asks for a status update, and offers to help unblock. Return only the email text.",
      prompt: `Original recipient: ${data.recipient}
Original subject: ${data.originalSubject}
Project: ${data.project || "(not specified)"}

Original email:
${data.originalEmail}`,
    });
    return { text };
  });

const PlanInput = z.object({
  mode: z.enum(["Daily", "Weekly"]),
  hours: z.string().min(1),
  tasks: z.string().min(1),
  priorities: z.string().default(""),
});

export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => PlanInput.parse(data))
  .handler(async ({ data }) => {
    const { text } = await generateText({
      model: getModel(),
      system:
        "You are an expert productivity coach. Build a clear, prioritized schedule with time blocks. Use markdown with a table or bullet list. Return only the schedule.",
      prompt: `Create a ${data.mode.toLowerCase()} schedule.
Working hours: ${data.hours}
Tasks:
${data.tasks}
Priorities: ${data.priorities || "(infer sensible priorities)"}`,
    });
    return { text };
  });

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
});

export const chat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ChatInput.parse(data))
  .handler(async ({ data }) => {
    const { text } = await generateText({
      model: getModel(),
      system:
        "You are a helpful AI workplace assistant. Answer workplace-related questions clearly and concisely. Use markdown when helpful.",
      messages: data.messages,
    });
    return { text };
  });
