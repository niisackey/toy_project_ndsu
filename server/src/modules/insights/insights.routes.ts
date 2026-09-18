import { Router } from "express";
import { asyncHandler } from "../../shared/errors";
import { generateLlmInsights, isLlmConfigured } from "./llm";
import { generateInsights } from "./rules";

export const insightsRouter = Router();

insightsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    if (isLlmConfigured()) {
      try {
        const insights = await generateLlmInsights();
        res.json({ source: "ai", insights });
        return;
      } catch (err) {
        console.error("AI insights failed, falling back to rule-based insights:", err);
      }
    }
    res.json({ source: "rules", insights: generateInsights() });
  }),
);
