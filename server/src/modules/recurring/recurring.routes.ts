import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../shared/errors";
import * as recurringService from "./recurring.service";
import { runDueRules } from "./recurring.scheduler";

export const recurringRouter = Router();

const recurringSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  accountId: z.number().int(),
  categoryId: z.number().int().nullable().optional(),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "semesterly", "yearly"]),
  intervalCount: z.number().int().positive().optional(),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

recurringRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(recurringService.listRecurringRules());
  }),
);

recurringRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = recurringSchema.parse(req.body);
    res.status(201).json(recurringService.createRecurringRule(input));
  }),
);

recurringRouter.post(
  "/run-due",
  asyncHandler(async (_req, res) => {
    const generatedCount = runDueRules();
    res.json({ generatedCount });
  }),
);

recurringRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = recurringSchema.partial().parse(req.body);
    res.json(recurringService.updateRecurringRule(Number(req.params.id), input));
  }),
);

recurringRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    recurringService.deleteRecurringRule(Number(req.params.id));
    res.status(204).send();
  }),
);
