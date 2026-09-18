import Anthropic from "@anthropic-ai/sdk";
import { buildFinancialSnapshot } from "./snapshot";
import type { Insight } from "./rules";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const CACHE_TTL_MS = 3 * 60 * 1000;

let client: Anthropic | null = null;
let cache: { generatedAt: number; snapshotKey: string; insights: Insight[] } | null = null;

export function isLlmConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  if (!client) {
    // org-level keys (not tied to one workspace) 400 without this header.
    // normal workspace-scoped keys from the console don't need it.
    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultHeaders: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
    });
  }
  return client;
}

const SYSTEM_PROMPT = `You are a financial coach helping a graduate student in the US manage their money - a modest stipend, a couple of credit cards they are actively trying to build credit with, and student-sized expenses.

You will be given a JSON snapshot of their current accounts, budgets, spending, recurring bills, savings goals, and a simulated credit-health breakdown. Analyze it and produce a short list of specific, personalized, actionable insights grounded ONLY in the numbers you were given - never invent transactions, amounts, or dates that are not in the data.

Respond with ONLY a JSON array (no markdown fences, no prose before or after), where each item has exactly these fields:
- "type": one of "tip", "warning", "positive"
- "category": a short lowercase label like "spending", "budget", "credit", "savings", "income", "goals", "upcoming"
- "message": one or two sentences, specific and actionable, referencing real numbers/names from the data

Rules:
- 4 to 7 insights total, ordered most important first (warnings about money due soon or over budget first).
- Use "warning" for things that need attention soon (payment due dates, over budget, high utilization, negative savings rate).
- Use "positive" to reinforce good habits you can see in the data (on pace for goals, good savings rate, low utilization) - don't skip these if they're true, students need encouragement too.
- Use "tip" for suggestions and things to keep an eye on.
- Be concrete: name the actual category, account, or goal and cite the real number.
- Never give generic advice unconnected to the data provided.`;

function extractJsonArray(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("LLM response did not contain a JSON array");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

function validateInsights(value: unknown): Insight[] {
  if (!Array.isArray(value)) throw new Error("LLM response was not an array");
  return value.map((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("type" in item) ||
      !("category" in item) ||
      !("message" in item)
    ) {
      throw new Error("LLM insight item missing required fields");
    }
    const { type, category, message } = item as Record<string, unknown>;
    if (type !== "tip" && type !== "warning" && type !== "positive") {
      throw new Error(`Invalid insight type: ${String(type)}`);
    }
    if (typeof category !== "string" || typeof message !== "string") {
      throw new Error("Invalid insight category/message");
    }
    return { type, category, message };
  });
}

export async function generateLlmInsights(): Promise<Insight[]> {
  const snapshot = buildFinancialSnapshot();
  const snapshotKey = JSON.stringify(snapshot);

  if (cache && cache.snapshotKey === snapshotKey && Date.now() - cache.generatedAt < CACHE_TTL_MS) {
    return cache.insights;
  }

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const response = await getClient().messages.create({
    model,
    max_tokens: 1024,
    temperature: 0.4,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here is the financial snapshot as JSON:\n\n${JSON.stringify(snapshot, null, 2)}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("LLM response had no text content");
  }

  const insights = validateInsights(extractJsonArray(textBlock.text));
  cache = { generatedAt: Date.now(), snapshotKey, insights };
  return insights;
}
